<?php
namespace Craft;

/**
 *
 */
class InfoModel extends BaseModel
{
	/**
	 * @return array
	 */
	public function defineAttributes()
	{
		return array(
			'id'          => AttributeType::Number,
			'version'     => array(AttributeType::Version, 'required' => true),
			'build'       => array(AttributeType::Build, 'required' => true),
			'packages'    => array(AttributeType::Mixed, 'default' => array()),
			'releaseDate' => array(AttributeType::DateTime, 'required' => true),
			'siteName'    => array(AttributeType::Name, 'required' => true),
			'siteUrl'     => array(AttributeType::Url, 'required' => true),
			'on'          => AttributeType::Bool,
			'maintenance' => AttributeType::Bool,
		);
	}

	/**
	 * Sets an attribute's value.
	 *
	 * @param string $name
	 * @param mixed $value
	 * @return bool
	 */
	public function setAttribute($name, $value)
	{
		// Set packages as an array
		if ($name == 'packages' && !is_array($value))
		{
			if ($value)
			{
				$value = array_filter(ArrayHelper::stringToArray($value));
				sort($value);
			}
			else
			{
				$value = array();
			}
		}

		return parent::setAttribute($name, $value);
	}

	/**
	 * Gets an attribute's value.
	 *
	 * @param string $name
	 * @param bool $flattenValue
	 * @return mixed
	 */
	public function getAttribute($name, $flattenValue = false)
	{
		// Flatten packages into a comma-delimited string, rather than JSON
		if ($name == 'packages' && $flattenValue)
		{
			return implode(',', parent::getAttribute('packages'));
		}
		else
		{
			return parent::getAttribute($name, $flattenValue);
		}
	}
}
